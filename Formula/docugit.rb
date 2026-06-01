# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_08.45.44_381a9e"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.45.44_381a9e/docugit-darwin-arm64"
      sha256 "78af5bd2793e85d3f085794eeefc60776f15752853937bb9aecd0f9821ce4b35"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.45.44_381a9e/docugit-darwin-amd64"
      sha256 "0bd3e3639fc86e012ab090ac8ca9684a7c375ba108c1b6bd0a02842bd66323bb"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.45.44_381a9e/docugit-linux-arm64"
      sha256 "933d8b2c06dfaf8db8ee1b53a45a1f168819a8d01903870f04bbf8a20bb29fc3"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.45.44_381a9e/docugit-linux-amd64"
      sha256 "8f8bf51652e0319ea5d37e4f4e0d0f08e253e874862526a5f3ef0551d2738bd9"
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
