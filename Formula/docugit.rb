# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_07.27.33_6cd96e"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_07.27.33_6cd96e/docugit-darwin-arm64"
      sha256 "264787decd2780fd96f2495c619ed5d3c623e8b40fc841a8472a3e8da07c0673"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_07.27.33_6cd96e/docugit-darwin-amd64"
      sha256 "d75be6f57f8d39706d55a1ee28c8c0b873e18dd5563eb8565a2469ab9ef63b09"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_07.27.33_6cd96e/docugit-linux-arm64"
      sha256 "578a3db6d0d5bd14865c42e42fe91e4c514700b710aa132a4e881ff1137c9cbb"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_07.27.33_6cd96e/docugit-linux-amd64"
      sha256 "f8689a151fbed83191b7119f1ef448f95d9426eda04d5af2381a32e766c5a5ce"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
