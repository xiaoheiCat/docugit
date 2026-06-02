# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_09.58.08_4527da"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.58.08_4527da/docugit-darwin-arm64"
      sha256 "7aa4d4b31d6fa04fe559529060189f91f16b8748c81dbf0443c09e46d2b98a4b"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.58.08_4527da/docugit-darwin-amd64"
      sha256 "b9afb6fc7744db4483c4d6f286fcb50b6faa251db1a711344f60f8dfe4225f6a"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.58.08_4527da/docugit-linux-arm64"
      sha256 "5bdac1d9ae689f0856f5e5ec8e7abd94c1e88619f0f98ca8dabc3e4c23d15399"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.58.08_4527da/docugit-linux-amd64"
      sha256 "3090eb4de97ea21718b7788e049cece7bf0f51d64f0e5c9d1c801221d70c73ca"
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
