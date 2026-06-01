# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_11.26.23_23a1db"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.26.23_23a1db/docugit-darwin-arm64"
      sha256 "14a43e265a6e2f82ee318d850118dff8628dc6f8a0e6e501aec72a79d8f714f2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.26.23_23a1db/docugit-darwin-amd64"
      sha256 "e3dc11197ed352850e95935fd33565070f94b5ef05465ac88dcb37cd7a653a47"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.26.23_23a1db/docugit-linux-arm64"
      sha256 "c58a08c309157358a55e6e8ee0b6ce0f2319ad84dc2ec8cea9d76de7efe5b7ec"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.26.23_23a1db/docugit-linux-amd64"
      sha256 "110619f42fdc89af1293c8cd9252668cb9f0682f8a5cc161d74b4f93c23d1529"
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
